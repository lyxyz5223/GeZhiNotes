package models

import (
	"LiyerNortorsAIpart/internal/db"

	"context"
	"errors"
	"mime/multipart"

	"github.com/gin-gonic/gin"
	//"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func removeDuplicates(input []string) []string {
    seen := make(map[string]struct{})
    result := []string{}

    for _, v := range input {
        if _, ok := seen[v]; !ok {
            seen[v] = struct{}{}
            result = append(result, v)
        }
    }

    return result
}

func GetNewTagsFromText(c *gin.Context,text []string, alltags []string) ([]string, error){
	var tags []string
	for _, v := range(text){
		tmp, err := Extract(c, v, alltags)
		if err != nil {
			return nil, errors.New("extract failed")
		}
		tags = append(tags, tmp...)
	}

	return tags, nil
}

func GetTagsFromImg(){}

func Save(c *gin.Context, uid int, img *multipart.FileHeader, req *SaveReq) error{
	pg, err := db.GetDB()
	if err != nil {
		return err
	}


	/*row := pg.QueryRow(context.TODO(), `SELECT uid from canvans where pid = $1`, req.Pid)
	
	var realUid int
	if err := row.Scan(&realUid); err != nil {
		return err
	}

	if realUid != uid {
		return errors.New("not the right user")
	}*/

	var alltags []string
	var tagArray pgtype.Array[string]
	row := pg.QueryRow(context.TODO(), `SELECT tags::text[] from "user" where uid = $1`,uid)
	if err := row.Scan(&tagArray); err != nil {
		return err
	}

	for _, v := range tagArray.Elements {
		alltags = append(alltags, v)
	}
	tags, err  := GetNewTagsFromText(c, req.Text, alltags) 
	if err != nil {
		return err
	}

	for _, v := range(tags) {
		println(v)
	}
	for _, tag := range(tags){
		if _, err := pg.Exec(context.TODO(),
		`
		INSERT INTO canvans(tags, pid, uid)
		VALUES(ARRAY[$1], $2, $3)
		ON CONFLICT (pid, uid) DO UPDATE
		SET tags = array_append(canvans.tags, $1)
		`,
		tag, req.Pid, uid); err != nil {
			return err
		}
	}

	alltags = append(alltags, tags...)
	alltags = removeDuplicates(alltags)

	if _, err := pg.Exec(context.TODO(),
	`
	UPDATE "user"
	SET tags = $1
	`, alltags); err != nil {
		return err
	}

	if _, err := pg.Exec(context.TODO(),`UPDATE "user" SET modified = $1 where uid = $2`, req.Modified, uid); err != nil{
		return err
	}

	return nil
}

func Analyze(c *gin.Context, uid int, input *AnalyzeReq) ([]string, error){
	pg, err := db.GetDB()
	if err != nil {
		return nil, err
	}

	var alltags []string
	var modified int
	println(1)
	row := pg.QueryRow(context.TODO(), `SELECT tags, modified from "user" where uid = $1`, uid)
	if err := row.Scan(&alltags, &modified); err != nil {
		return nil, err
	}

	if modified != input.Modified {
		return nil, errors.New("last change haven't saved")
	}
	
	tags, err := Contact(c, alltags, input.Input)
	if err != nil {
		return nil, err
	}

	var targets []string

	for _, v := range(tags){
		println(v)
	}
	rows, err := pg.Query(context.TODO(),`SELECT pid FROM canvans where uid = $1 AND tags && $2`, uid, tags)
	defer rows.Close()
	var now int = 0
	for rows.Next(){
		var pid string
		if err = rows.Scan(&pid); err != nil{
			return nil, err
		}
		now ++
		targets = append(targets, pid)
		if(now == 10){
			break
	
		}
	}
	
	return targets, nil
}