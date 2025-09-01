package middleware

import (
	"net/http"
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
				if anyMatch(permissions, activePermissions) {
					next.ServeHTTP(w, r)
					return
				}
			}

			respondForbidden(w)
		})
	}
}

func anyMatch(a, b []string) bool {
	set := make(map[string]bool, len(a))
	for _, x := range a {
		set[x] = true
	}
	for _, y := range b {
		if _, ok := set[y]; ok {
			return true
		}
	}
	return false
}
