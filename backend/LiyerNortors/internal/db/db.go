package db

import (
	"LiyerNortorsAIpart/config"

	"context"

	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
)


func GetDB() (*pgx.Conn, error) {
	ctx := context.Background()
	Config, err := config.SetUp()
	if err != nil {
		return nil, err
	}
	Dsn := "postgres://" + Config.Pg.User + ":" + Config.Pg.Password + "@" + Config.Pg.Host + ":" + Config.Pg.Port + "/" + Config.Pg.DBName
	conn, err := pgx.Connect(ctx, Dsn)
	if err != nil {
		return nil, err
	}
	return conn, nil
}

func GetRedis() (*redis.Client, error) {
	Config, err := config.SetUp()
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(&redis.Options{
		Addr:     Config.Redis.Host + ":" + Config.Redis.Port,
		Password: Config.Redis.Password,
		DB:       0,
	})
	return client, nil
}
