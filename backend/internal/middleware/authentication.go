package middleware

import (
	"net/http"

	"github.com/Sakrafux/family-tree/backend/internal/errors"
)

func Authentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO proper authentication
		if _, ok := r.Context().Value("auth").(string); !ok {
			errors.HandleHttpError(w, r, errors.NewUnauthorizedError(""))
			return
		}

		next.ServeHTTP(w, r)
	})
}
