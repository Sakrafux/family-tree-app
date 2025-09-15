package router

import (
	"net/http"

	"github.com/Sakrafux/family-tree-app/backend/internal/middleware"
)

type AuthServeMux struct {
	*http.ServeMux
}

func NewAuthServeMux() *AuthServeMux {
	return &AuthServeMux{http.NewServeMux()}
}

func (a *AuthServeMux) HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request), permissions ...string) {
	if len(permissions) == 0 {
		a.ServeMux.HandleFunc(pattern, handler)
		return
	}
	a.ServeMux.Handle(pattern, middleware.Authorization(permissions)(http.HandlerFunc(handler)))
}

func (a *AuthServeMux) Handle(pattern string, handler http.Handler, permissions ...string) {
	if len(permissions) == 0 {
		a.ServeMux.Handle(pattern, handler)
		return
	}
	a.ServeMux.Handle(pattern, middleware.Authorization(permissions)(handler))
}
