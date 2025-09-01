package middleware

import (
	"net/http"
)

func respondUnauthorized(w http.ResponseWriter) {
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(http.StatusText(http.StatusUnauthorized)))
}

func Authentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO proper authentication
		if _, ok := r.Context().Value("auth").(string); !ok {
			respondUnauthorized(w)
			return
		}

		next.ServeHTTP(w, r)
	})
}
