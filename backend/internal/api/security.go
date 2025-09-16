package api

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/Sakrafux/family-tree-app/backend/internal/errors"
	"github.com/Sakrafux/family-tree-app/backend/internal/service"
)

type SecurityHandler struct {
	securityService *service.SecurityService
}

func NewSecurityHandler(sqlDb *sql.DB) *SecurityHandler {
	return &SecurityHandler{
		securityService: service.NewSecurityService(sqlDb),
	}
}

func (h *SecurityHandler) Login(w http.ResponseWriter, r *http.Request) {
	var login service.LoginRequest
	err := json.NewDecoder(r.Body).Decode(&login)
	if err != nil {
		errors.HandleHttpError(w, r, errors.NewUnprocessableEntityError(err.Error()))
		return
	}

	rt, at, err := h.securityService.Login(login.Username, login.Password)
	if err != nil {
		errors.HandleHttpError(w, r, err)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    rt,
		HttpOnly: true,
		Secure:   false,
		Path:     "/api/security/token",
		MaxAge:   30 * 24 * 60 * 60, // 7 days
		SameSite: http.SameSiteStrictMode,
	})

	dto := service.AccessTokenDto{AccessToken: at}
	writeJson(w, dto)
}

func (h *SecurityHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		errors.HandleHttpError(w, r, errors.NewBadRequestError(err.Error()))
		return
	}
	token := cookie.Value

	rt, at, err := h.securityService.RefreshTokens(token)
	if err != nil {
		errors.HandleHttpError(w, r, err)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    rt,
		HttpOnly: true,
		Secure:   false, // bad for local development
		Path:     "/api/security/token",
		MaxAge:   30 * 24 * 60 * 60, // 30 days
		SameSite: http.SameSiteStrictMode,
	})

	dto := service.AccessTokenDto{AccessToken: at}
	writeJson(w, dto)
}
