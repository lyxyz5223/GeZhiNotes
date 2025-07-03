package models

type UserInfo struct {
	Uid int
	Name string
	password string 
	AllTags []string
	Modified int
}

type SubCanvas struct {
	Cid  string
	Tags []string
}