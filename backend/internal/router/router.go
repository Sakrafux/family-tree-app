package router

import (
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/api"
	"github.com/kuzudb/go-kuzu"
)

func CreaterRouter(conn *kuzu.Connection) *AuthServeMux {
	router := NewAuthServeMux()

	apiHandler := api.NewHandler(conn)
	apiRouter := NewAuthServeMux()

	apiRouter.HandleFunc("GET /nodes/persons", apiHandler.GetAllPersons)
	apiRouter.HandleFunc("GET /relations/marriages", apiHandler.GetAllMarriageRelations)
	apiRouter.HandleFunc("GET /relations/parents", apiHandler.GetAllParentRelations)
	apiRouter.HandleFunc("GET /relations/siblings", apiHandler.GetAllSiblingRelations)
	apiRouter.HandleFunc("GET /graph/complete", apiHandler.GetCompleteGraphData)
	apiRouter.HandleFunc("GET /graph/sub", apiHandler.GetSubgraphForRoot)

	router.Handle("/", apiRouter)

	// TODO apply proper RBAC with this reference code
	//apiRouter.HandleFunc("GET /graph/complete", apiHandler.GetCompleteGraphData, constants.AUTH_PERMISSION_ADMIN)
	//router.Handle("/", apiRouter, constants.AUTH_PERMISSION_READ)

	router.Handle("/public/", http.StripPrefix("/public", createPublicRouter()))

	routerWrapper := NewAuthServeMux()
	routerWrapper.Handle("/api/", http.StripPrefix("/api", router))
	routerWrapper.Handle("/", NewFrontendSpaHandler())
	return routerWrapper
}

func createPublicRouter() *AuthServeMux {
	publicRouter := NewAuthServeMux()

	publicRouter.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("OK"))
	})

	return publicRouter
}
