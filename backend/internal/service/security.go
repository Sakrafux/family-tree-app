package service

import (
	"database/sql"

	"github.com/Sakrafux/family-tree-app/backend/internal/db"
	"github.com/Sakrafux/family-tree-app/backend/internal/errors"
	"github.com/Sakrafux/family-tree-app/backend/internal/security"
)

type SecurityService struct {
	db *sql.DB
}

func NewSecurityService(db *sql.DB) *SecurityService {
	return &SecurityService{db: db}
}

func (s *SecurityService) Login(username, password string) (string, string, error) {
	user, err := db.GetUser(s.db, username, password)
	if err != nil {
		return "", "", errors.NewUnauthorizedError(err.Error())
	}

	refreshToken, err := security.CreateRefreshToken(user.Id, user.Role)
	if err != nil {
		return "", "", errors.NewInternalServerError(err.Error())
	}
	accessToken, err := security.CreateAccessToken(user.Id, user.Role)
	if err != nil {
		return "", "", errors.NewInternalServerError(err.Error())
	}

	return refreshToken, accessToken, nil
}

func (s *SecurityService) RefreshTokens(refreshToken string) (string, string, error) {
	token, err := security.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", "", errors.NewUnauthorizedError(err.Error())
	}

	userID, role, err := security.ExtractUserIdAndRole(token)
	if err != nil {
		return "", "", errors.NewInternalServerError(err.Error())
	}

	rt, err := security.CreateRefreshToken(userID, role)
	if err != nil {
		return "", "", errors.NewInternalServerError(err.Error())
	}

	at, err := security.CreateAccessToken(userID, role)
	if err != nil {
		return "", "", errors.NewInternalServerError(err.Error())
	}

	return rt, at, nil
}
