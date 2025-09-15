package middleware

import (
	"net/http"

	"github.com/Sakrafux/family-tree-app/backend/internal/errors"
	"github.com/samber/lo"
)

func Authorization(permissions []string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if activePermissions, ok := r.Context().Value("permissions").([]string); ok {
				if lo.Some(permissions, activePermissions) {
					next.ServeHTTP(w, r)
					return
				}
				errors.HandleHttpError(w, r, errors.NewForbiddenError("User does not have correct permissions"))
			} else {
				errors.HandleHttpError(w, r, errors.NewUnauthorizedError("User is not authenticated"))
			}
		})
	}
}
