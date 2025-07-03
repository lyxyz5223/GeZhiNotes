package models

import (
	"LiyerNortorsAIpart/internal/db"

	"crypto/sha256"
	"encoding/hex"
	"context"
)

func HashPwd(password string) string {
	hashPwd := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hashPwd[:]);	
}

func Register(req *RegisterReq) error{
	pg, err := db.GetDB()
	if err != nil {
		return err
	}

	hashPwd := HashPwd(req.Password)

	if _, err := pg.Exec(context.TODO(), `INSERT INTO "user" (name, password) VALUES($1, $2)`, req.Name, hashPwd); err != nil {
		return err
	}

	return nil
}

