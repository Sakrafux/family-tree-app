package router

import (
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/api"
	"github.com/Sakrafux/family-tree/backend/internal/server"
)

func RegisterRoutes(context *server.ApplicationContext) *AuthServeMux {
	router := NewAuthServeMux()

	apiHandler := &api.Handler{Context: context}
	apiRouter := NewAuthServeMux()

	apiRouter.HandleFunc("GET /nodes/persons", apiHandler.GetAllPersons)
	apiRouter.HandleFunc("GET /relations/marriages", apiHandler.GetAllMarriageRelations)
	apiRouter.HandleFunc("GET /relations/parents", apiHandler.GetAllParentRelations)
	apiRouter.HandleFunc("GET /graph/complete", apiHandler.GetCompleteGraphData, "ADMIN")

	router.Handle("/api/", http.StripPrefix("/api", apiRouter), "READ")

	publicRouter := NewAuthServeMux()

	publicRouter.HandleFunc("GET /test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	router.Handle("/public/", http.StripPrefix("/public", publicRouter))

	return router
}
