package db

import "time"

type Feedback struct {
	Id         int
	Text       string
	Timestamp  time.Time
	IsResolved bool
}

type User struct {
	Id       int
	Username string
	Password string
	Salt     string
	Role     string
	NodeId   string
}
