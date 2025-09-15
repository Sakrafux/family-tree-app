package router

import (
	"database/sql"
	"net/http"

	"github.com/Sakrafux/family-tree-app/backend/internal/api"
	"github.com/Sakrafux/family-tree-app/backend/internal/constants"
	"github.com/kuzudb/go-kuzu"
)

func CreaterRouter(kuzuConn *kuzu.Connection, sqlDb *sql.DB) *AuthServeMux {
	router := NewAuthServeMux()

	apiHandler := api.NewHandler(kuzuConn, sqlDb)
	apiRouter := NewAuthServeMux()

	apiRouter.HandleFunc("GET /family-tree/{id}", apiHandler.GetFamilyTree, constants.AUTH_PERMISSION_READ)
	apiRouter.HandleFunc("GET /feedbacks", apiHandler.GetAllFeedbacks, constants.AUTH_PERMISSION_ADMIN)
	apiRouter.HandleFunc("POST /feedbacks", apiHandler.PostFeedback, constants.AUTH_PERMISSION_ADMIN)
	apiRouter.HandleFunc("OPTIONS /feedbacks", nullHandler)
	apiRouter.HandleFunc("PATCH /feedbacks/{id}", apiHandler.PatchFeedbackResolve, constants.AUTH_PERMISSION_ADMIN)
	apiRouter.HandleFunc("OPTIONS /feedbacks/{id}", nullHandler)

	router.Handle("/", apiRouter)

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

func nullHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}
