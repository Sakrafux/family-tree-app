package middleware

import (
	"context"
	"database/sql"
	"net/http"

	"github.com/Sakrafux/family-tree-app/backend/internal/db"
	"github.com/Sakrafux/family-tree-app/backend/internal/errors"
	"github.com/Sakrafux/family-tree-app/backend/internal/security"
)

func Authentication(sqlDb *sql.DB) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// TODO proper user data with JWT
			username := ""
			password := ""
			if queryUsername, ok := r.URL.Query()["username"]; ok {
				username = queryUsername[0]
			}
			if queryPassword, ok := r.URL.Query()["password"]; ok {
				password = queryPassword[0]
			}

			if username == "" {
				next.ServeHTTP(w, r)
				return
			}

			user, err := db.GetUser(sqlDb, username, password)
			if err != nil {
				errors.HandleHttpError(w, r, errors.NewUnauthorizedError(err.Error()))
				return
			}

			permissions := security.GetPermissionsForRole(user.Role)
			ctx := r.Context()
			ctx = context.WithValue(ctx, "username", username)
			ctx = context.WithValue(ctx, "role", user.Role)
			ctx = context.WithValue(ctx, "permissions", permissions)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
