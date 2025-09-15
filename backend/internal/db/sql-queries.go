package db

import (
	"database/sql"
	"fmt"

	"github.com/Sakrafux/family-tree-app/backend/internal/security"
)

func SelectAllFeedbacks(db *sql.DB) ([]*Feedback, error) {
	rows, err := db.Query("SELECT id, text, creation_timestamp, is_resolved FROM feedback")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	feedbacks := make([]*Feedback, 0)
	for rows.Next() {
		fb := &Feedback{}
		var isResolvedInt int
		if err := rows.Scan(&fb.Id, &fb.Text, &fb.Timestamp, &isResolvedInt); err != nil {
			return nil, err
		}
		if isResolvedInt != 0 {
			fb.IsResolved = true
		}
		feedbacks = append(feedbacks, fb)
	}

	return feedbacks, nil
}

func InsertFeedback(db *sql.DB, text string) (*Feedback, error) {
	res, err := db.Exec("INSERT INTO feedback (text) VALUES ($1)", text)
	if err != nil {
		return nil, err
	}

	lastID, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	fb := &Feedback{}
	err = db.QueryRow(
		"SELECT id, text, creation_timestamp FROM feedback WHERE id = ?",
		lastID,
	).Scan(&fb.Id, &fb.Text, &fb.Timestamp)
	if err != nil {
		return nil, err
	}

	return fb, nil
}

func UpdateFeedbackIsResolved(db *sql.DB, id int, isResolved bool) error {
	isResolvedInt := 0
	if isResolved {
		isResolvedInt = 1
	}
	_, err := db.Exec("UPDATE feedback SET is_resolved = $1 WHERE id = $2", isResolvedInt, id)
	if err != nil {
		return err
	}
	return nil
}

func GetUser(db *sql.DB, username, password string) (*User, error) {
	user := &User{}
	err := db.QueryRow("SELECT id, name, password, salt, role FROM users WHERE name = $1", username).Scan(
		&user.Id, &user.Username, &user.Password, &user.Salt, &user.Role)
	if err != nil {
		return nil, err
	}

	if security.VerifyPassword(password, []byte(user.Salt), []byte(user.Password)) {
		return user, nil
	}

	return nil, fmt.Errorf("invalid username or password")
}
