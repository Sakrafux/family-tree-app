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

	tokenData := &security.TokenData{Id: user.Id, Role: user.Role, NodeId: user.NodeId}
	refreshToken, err := security.CreateRefreshToken(tokenData)
	if err != nil {
		return "", "", errors.NewInternalServerError(err.Error())
	}
	accessToken, err := security.CreateAccessToken(tokenData)
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

	userID, role, nodeId, err := security.ExtractUserData(token)
	if err != nil {
		return "", "", errors.NewInternalServerError(err.Error())
	}
	tokenData := &security.TokenData{Id: userID, Role: role, NodeId: nodeId}

	rt, err := security.CreateRefreshToken(tokenData)
	if err != nil {
		return "", "", errors.NewInternalServerError(err.Error())
	}

	at, err := security.CreateAccessToken(tokenData)
	if err != nil {
		return "", "", errors.NewInternalServerError(err.Error())
	}

	return rt, at, nil
}
