package router

import (
	"database/sql"
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/api"
	"github.com/kuzudb/go-kuzu"
)

func CreaterRouter(kuzuConn *kuzu.Connection, sqlDb *sql.DB) *AuthServeMux {
	router := NewAuthServeMux()

	apiHandler := api.NewHandler(kuzuConn, sqlDb)
	apiRouter := NewAuthServeMux()

	apiRouter.HandleFunc("GET /family-tree/{id}", apiHandler.GetFamilyTree)
	apiRouter.HandleFunc("GET /feedbacks", apiHandler.GetAllFeedbacks)
	apiRouter.HandleFunc("POST /feedbacks", apiHandler.PostFeedback)
	apiRouter.HandleFunc("OPTIONS /feedbacks", nullHandler)

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

func nullHandler(writer http.ResponseWriter, request *http.Request) {

}
