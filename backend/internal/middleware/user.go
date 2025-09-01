package middleware

import (
	"context"
	"net/http"
)

func LoadUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO proper user data with JWT
		ctx := r.Context()
		if authId, ok := r.URL.Query()["auth"]; ok {
			ctx = context.WithValue(r.Context(), "auth", authId[0])

			permissions := []string{"READ"}
			if authId[0] == "admin" {
				permissions = append(permissions, "ADMIN")
			}
			ctx = context.WithValue(ctx, "permissions", permissions)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
