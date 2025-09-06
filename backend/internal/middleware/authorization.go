package middleware

import (
	"net/http"

	"github.com/samber/lo"
)

func respondForbidden(w http.ResponseWriter) {
	w.WriteHeader(http.StatusForbidden)
	w.Write([]byte(http.StatusText(http.StatusForbidden)))
}

func Authorization(permissions []string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// TODO proper authentication
			if activePermissions, ok := r.Context().Value("permissions").([]string); ok {
				if lo.Some(permissions, activePermissions) {
					next.ServeHTTP(w, r)
					return
				}
			}

			respondForbidden(w)
		})
	}
}
