package models

import (
	"LiyerNortorsAIpart/internal/db"

	"context"
	"errors"
)

func Login(req *LoginReq) (int, error) {
	pg, err := db.GetDB()
	if err != nil {
		return 0, err
	}

	hashPwd := HashPwd(req.Password)

	var uid int
	var password string
	row := pg.QueryRow(context.TODO(), `Select uid, password from "user" where name = $1`, req.Name)  
	if err := row.Scan(&uid, &password); err != nil {
		return 0, err
	}
	
	if hashPwd != password {
		return 0, errors.New("password incorrect")
	}

	return uid, nil
}