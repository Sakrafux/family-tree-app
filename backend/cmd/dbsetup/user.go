package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/Sakrafux/family-tree-app/backend/internal/security"
)

func createUserValues(dataPathPrefix string) string {
	userFile, err := os.Open(publicOrPrivateData(dataPathPrefix) + "/users.csv")
	if err != nil {
		log.Fatal(err)
	}
	defer userFile.Close()

	users, err := csv.NewReader(userFile).ReadAll()
	if err != nil {
		log.Fatal(err)
	}

	userInserts := make([]string, len(users)-1)
	for i := 1; i < len(users); i++ {
		user := users[i]
		salt := security.GenerateSalt()
		password := security.HashPassword(user[1], salt)
		userInserts[i-1] = fmt.Sprintf("('%s','%s', '%s', '%s', '%s')", user[0], password, string(salt), user[2], user[3])
	}

	return strings.Join(userInserts, ",")
}
