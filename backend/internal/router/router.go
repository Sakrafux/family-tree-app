package router

import (
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/api"
	"github.com/Sakrafux/family-tree/backend/internal/constants"
	"github.com/Sakrafux/family-tree/backend/internal/server"
)

func RegisterRoutes(context *server.ApplicationContext) *AuthServeMux {
	router := NewAuthServeMux()

	apiHandler := &api.Handler{Context: context}
	apiRouter := NewAuthServeMux()

	apiRouter.HandleFunc("GET /nodes/persons", apiHandler.GetAllPersons)
	apiRouter.HandleFunc("GET /relations/marriages", apiHandler.GetAllMarriageRelations)
	apiRouter.HandleFunc("GET /relations/parents", apiHandler.GetAllParentRelations)
	apiRouter.HandleFunc("GET /graph/complete", apiHandler.GetCompleteGraphData, constants.AUTH_PERMISSION_ADMIN)

	router.Handle("/", apiRouter, constants.AUTH_PERMISSION_READ)

	publicRouter := NewAuthServeMux()

	publicRouter.HandleFunc("GET /test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	router.Handle("/public/", http.StripPrefix("/public", publicRouter))

	routerWrapper := NewAuthServeMux()
	routerWrapper.Handle("/api/", http.StripPrefix("/api", router))
	routerWrapper.Handle("/", NewFrontendHandler())
	return routerWrapper
}
