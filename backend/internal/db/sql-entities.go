package db

import "time"

type Feedback struct {
	Id         int
	Text       string
	Timestamp  time.Time
	IsResolved bool
}
