//go:build ignore

package main

import (
	"flag"
	"fmt"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"os"
	"regexp"
	"strings"

	. "github.com/dave/jennifer/jen"
)

func main() {
	output := flag.String("o", "caster_gen.go", "Output file for generated code")
	flag.Parse()

	targetPackage := os.Getenv("GOPACKAGE")

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

		for _, sf := range si.fields {
			var stmt *Statement
			var t *Statement

			if sf.qualified {
				t = Qual(sf.typePath, sf.typeName)
			} else {
				t = Id(sf.typeName)
			}

			if sf.pointer {
				targetName := strings.ToLower(sf.target)
				stmt = If(
					List(Id(targetName), Id("ok")).Op(":=").Id("data").Index(Lit(sf.source)).Dot("").Call(t),
					Id("ok"),
				).Block(Id(objName).Dot(sf.target).Op("=").Op("&").Id(targetName))
			} else {
				stmt = Id(objName).Dot(sf.target).Op("=").Id("data").Index(Lit(sf.source)).Dot("").Call(t)
			}
			statements = append(statements, stmt)
		}

		statements = append(statements, Empty())
		statements = append(statements, Return(Id(objName)))

		f.Func().Id(fmt.Sprintf("Cast%s", si.name)).Params(Id("data").Map(String()).Any()).Op("*").Id(si.name).Block(
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
}

type structField struct {
	source    string
	target    string
	pointer   bool
	qualified bool
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
	re := regexp.MustCompile("`cast-source:\"([^\"]+)\"`")

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

					if field.Tag != nil {
						sf.source = re.FindStringSubmatch(field.Tag.Value)[1]
					} else {
						sf.source = sf.target
					}

					if ident, ok := field.Type.(*ast.Ident); ok {
						sf.typeName = ident.Name
					} else if selectorExpr, ok := field.Type.(*ast.SelectorExpr); ok {
						sf.qualified = true
						sf.typePath = qualifiedPathMap[selectorExpr.X.(*ast.Ident).Name]
						sf.typeName = selectorExpr.Sel.Name
					} else if starExpr, ok := field.Type.(*ast.StarExpr); ok {
						sf.pointer = true

						if ident, ok := starExpr.X.(*ast.Ident); ok {
							sf.typeName = ident.Name
						} else if selectorExpr, ok := starExpr.X.(*ast.SelectorExpr); ok {
							sf.qualified = true
							sf.typePath = qualifiedPathMap[selectorExpr.X.(*ast.Ident).Name]
							sf.typeName = selectorExpr.Sel.Name
						}
					}

					fields = append(fields, sf)
				}
			}

			si.fields = fields
			structInfos = append(structInfos, si)
		}
	}

	return structInfos, qualifiedPathMap
}
