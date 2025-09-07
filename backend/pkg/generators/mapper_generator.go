//go:build ignore

package main

import (
	"flag"
	"fmt"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"log"
	"os"
	"regexp"
	"strings"

	. "github.com/dave/jennifer/jen"
	"github.com/samber/lo"
)

func main() {
	output := flag.String("o", "mapper_gen.go", "Output file for generated code")
	flag.Parse()

	callerFileName := os.Getenv("GOFILE")
	targetPackage := os.Getenv("GOPACKAGE")

	log.Println(fmt.Sprintf("Generating mapper for %s in package %s...", callerFileName, targetPackage))

	structs, imports := extractInfo()

	f := NewFile(targetPackage)
	f.HeaderComment("// Code generated ... DO NOT EDIT.")

	for pck, path := range imports {
		f.ImportName(path, pck)
	}

	for _, si := range structs {
		objName := strings.ToLower(si.name)

		statements := make([]Code, 0)
		statements = append(statements, Id(objName).Op(":=").Op("&").Id(si.name).Values())
		statements = append(statements, Empty())

		methods := make([]Code, 0)
		fieldNames := make([]string, 0)

		for _, sf := range si.fields {
			var stmt *Statement

			if sf.function != nil {
				stmt = Id(objName).Dot(sf.target).Op("=").Id(*sf.function).Params(Id("source"))
				statements = append(statements, stmt)
				continue
			}

			op := ""
			if sf.pointer == "VtP" {
				op = "&"
			} else if sf.pointer == "PtV" {
				op = "*"
			}

			varElem := Id(strings.ToLower(sf.target)).Op(":=").Id("source").Dot(fmt.Sprintf("Get%s", sf.source)).Params()
			stmt = Id(objName).Dot(sf.target).Op("=").Op(op).Id(strings.ToLower(sf.target))

			if sf.pointer == "PtV" {
				stmt = If(Id(strings.ToLower(sf.target)).Op("!=").Nil()).Block(stmt)
			}

			statements = append(statements, varElem, stmt)

			if !lo.Contains(fieldNames, sf.source) {
				t := Empty()

				if sf.isPointer {
					t = Op("*")
				}

				if sf.qualified {
					t = t.Qual(sf.typePath, sf.typeName)
				} else {
					t = t.Id(sf.typeName)
				}

				method := Id(fmt.Sprintf("Get%s", sf.source)).Params().Parens(t)
				methods = append(methods, method)
				fieldNames = append(fieldNames, sf.source)
			}
		}

		statements = append(statements, Empty())
		statements = append(statements, Return(Id(objName)))

		f.Type().Id(fmt.Sprintf("%sSource", si.name)).Interface(methods...)
		f.Empty()

		f.Func().Id(fmt.Sprintf("MapTo%s", si.name)).Params(Id("source").Id(fmt.Sprintf("%sSource", si.name))).Op("*").Id(si.name).Block(
			statements...,
		)
		f.Empty()
	}

	formatted, err := format.Source([]byte(f.GoString()))
	if err != nil {
		panic(err)
	}

	if err := os.WriteFile(*output, formatted, 0644); err != nil {
		panic(err)
	}

	log.Println(fmt.Sprintf("Generated code in %s", *output))
}

type structField struct {
	source    string
	target    string
	pointer   string
	function  *string
	qualified bool
	isPointer bool
	// Only relevant for qualified
	typePath string
	typeName string
}

type structInfo struct {
	name   string
	fields []structField
}

func extractInfo() ([]structInfo, map[string]string) {
	callerFileName := os.Getenv("GOFILE")
	reMapFrom := regexp.MustCompile("map-from:\"([^\"]+)\"")
	reMapPointer := regexp.MustCompile("map-pointer:\"([^\"]+)\"")
	reMapFunc := regexp.MustCompile("map-func:\"([^\"]+)\"")
	reMapIgnore := regexp.MustCompile("map-ignore:\"([^\"]+)\"")

	f, err := parser.ParseFile(token.NewFileSet(), callerFileName, nil, 0)
	if err != nil {
		panic(err)
	}

	qualifiedPathMap := make(map[string]string)
	for _, importSpec := range f.Imports {
		strippedString := importSpec.Path.Value[1 : len(importSpec.Path.Value)-1]
		pathParts := strings.Split(strippedString, "/")
		lastPart := pathParts[len(pathParts)-1]
		qualifiedPathMap[lastPart] = strippedString
	}

	structInfos := make([]structInfo, 0)
	for _, decl := range f.Decls {
		// Only look at general declarations (types, vars, consts)
		genDecl, ok := decl.(*ast.GenDecl)
		if !ok || genDecl.Tok != token.TYPE {
			continue
		}

		// Inspect type specs
		for _, spec := range genDecl.Specs {
			typeSpec, ok := spec.(*ast.TypeSpec)
			if !ok {
				continue
			}

			// Check if it's a struct
			structType, ok := typeSpec.Type.(*ast.StructType)
			if !ok {
				continue
			}

			si := structInfo{name: typeSpec.Name.Name}
			fields := make([]structField, 0)

			for _, field := range structType.Fields.List {
				// Each field can have multiple names (e.g., "x, y int")
				for _, name := range field.Names {
					sf := structField{target: name.Name}

					source := name.Name
					pointer := ""
					function := ""
					ignore := false
					if field.Tag != nil {
						mapFromMatches := reMapFrom.FindStringSubmatch(field.Tag.Value)
						if mapFromMatches != nil {
							source = mapFromMatches[1]
						}
						mapPointerMatches := reMapPointer.FindStringSubmatch(field.Tag.Value)
						if mapPointerMatches != nil {
							pointer = mapPointerMatches[1]
						}
						mapFuncMatches := reMapFunc.FindStringSubmatch(field.Tag.Value)
						if mapFuncMatches != nil {
							function = mapFuncMatches[1]
						}
						mapIgnoreMatches := reMapIgnore.FindStringSubmatch(field.Tag.Value)
						if mapIgnoreMatches != nil {
							ignore = mapIgnoreMatches[1] == "true"
						}
					}

					sf.source = source
					sf.pointer = pointer
					if len(function) > 0 {
						sf.function = &function
					}

					if ident, ok := field.Type.(*ast.Ident); ok {
						sf.typeName = ident.Name
					} else if selectorExpr, ok := field.Type.(*ast.SelectorExpr); ok {
						sf.qualified = true
						sf.typePath = qualifiedPathMap[selectorExpr.X.(*ast.Ident).Name]
						sf.typeName = selectorExpr.Sel.Name
					} else if starExpr, ok := field.Type.(*ast.StarExpr); ok {
						sf.isPointer = true

						if ident, ok := starExpr.X.(*ast.Ident); ok {
							sf.typeName = ident.Name
						} else if selectorExpr, ok := starExpr.X.(*ast.SelectorExpr); ok {
							sf.qualified = true
							sf.typePath = qualifiedPathMap[selectorExpr.X.(*ast.Ident).Name]
							sf.typeName = selectorExpr.Sel.Name
						}
					}

					if !ignore {
						fields = append(fields, sf)
					}
				}
			}

			si.fields = fields
			structInfos = append(structInfos, si)
		}
	}

	return structInfos, qualifiedPathMap
}
