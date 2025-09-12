package db

import "database/sql"

func GetAllFeedbacks(db *sql.DB) ([]*Feedback, error) {
	rows, err := db.Query("SELECT id, text, creation_timestamp FROM feedback")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	feedbacks := make([]*Feedback, 0)
	for rows.Next() {
		fb := &Feedback{}
		if err := rows.Scan(&fb.Id, &fb.Text, &fb.Timestamp); err != nil {
			return nil, err
		}
		feedbacks = append(feedbacks, fb)
	}

	return feedbacks, nil
}

func PostFeedback(db *sql.DB, text string) (*Feedback, error) {
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
