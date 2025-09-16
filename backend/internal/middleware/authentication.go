package middleware

import (
	"context"
	"database/sql"
	"net/http"

	"github.com/Sakrafux/family-tree-app/backend/internal/constants"
	"github.com/Sakrafux/family-tree-app/backend/internal/db"
	"github.com/Sakrafux/family-tree-app/backend/internal/errors"
	"github.com/Sakrafux/family-tree-app/backend/internal/security"
)

func Authentication(sqlDb *sql.DB) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			tokenString := ""
			if len(auth) > 7 && auth[:7] == "Bearer " {
				tokenString = auth[7:]
			} else {
				next.ServeHTTP(w, r)
				return
			}

			token, err := security.ValidateAccessToken(tokenString)
			if err != nil {
				errors.HandleHttpError(w, r, errors.NewUnauthorizedError(err.Error()))
				return
			}

			userId, _, _, err := security.ExtractUserData(token)
			if err != nil {
				errors.HandleHttpError(w, r, errors.NewInternalServerError(err.Error()))
				return
			}

			user, err := db.GetUserById(sqlDb, userId)
			if err != nil {
				errors.HandleHttpError(w, r, errors.NewUnauthorizedError(err.Error()))
				return
			}

			permissions := security.GetPermissionsForRole(user.Role)
			ctx := r.Context()
			ctx = context.WithValue(ctx, constants.AUTH_CONTEXT_USERNAME, user.Username)
			ctx = context.WithValue(ctx, constants.AUTH_CONTEXT_ROLE, user.Role)
			ctx = context.WithValue(ctx, constants.AUTH_CONTEXT_PERMISSIONS, permissions)
			ctx = context.WithValue(ctx, constants.AUTH_CONTEXT_NODE, user.NodeId)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
