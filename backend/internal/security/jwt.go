package security

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var accessSecret = []byte(os.Getenv("ACCESS_SECRET"))
var refreshSecret = []byte(os.Getenv("REFRESH_SECRET"))

func CreateAccessToken(id int, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": fmt.Sprintf("%d", id),
		"exp":     time.Now().Add(time.Minute * 1).Unix(),
		"iat":     time.Now().Unix(),
		"role":    role,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(accessSecret)
	return tokenString, err
}

func CreateRefreshToken(id int, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": fmt.Sprintf("%d", id),
		"exp":     time.Now().Add(time.Minute * 3).Unix(),
		"iat":     time.Now().Unix(),
		"role":    role,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(refreshSecret)
}

func ValidateAccessToken(tokenStr string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return accessSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid access token")
	}

	return token, nil
}

func ValidateRefreshToken(tokenStr string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return refreshSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid refresh token")
	}

	return token, nil
}

func ExtractUserIdAndRole(token *jwt.Token) (int, string, error) {
	claims := token.Claims.(jwt.MapClaims)
	userId, err := strconv.Atoi(claims["user_id"].(string))
	if err != nil {
		return 0, "", err
	}
	role, ok := claims["role"].(string)
	if !ok {
		return 0, "", fmt.Errorf("invalid access token")
	}
	return userId, role, nil
}
