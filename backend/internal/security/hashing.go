package security

import (
	"crypto/rand"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func GenerateSalt() []byte {
	return []byte(rand.Text())
}

func HashPassword(password string, salt []byte) []byte {
	combined := append(salt, []byte(password)...)
	hashed, err := bcrypt.GenerateFromPassword(combined, bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	return hashed
}

func VerifyPassword(password string, salt, storedHash []byte) bool {
	combined := append(salt, []byte(password)...)

	err := bcrypt.CompareHashAndPassword(storedHash, combined)
	return err == nil
}
