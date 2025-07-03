package config

type Setting struct {
	App struct {
		Name string `yaml:"name"`
	} `yaml:"app"`
	Pg struct {
		Host     string `yaml:"host"`
		User     string `yaml:"user"`
		DBName   string `yaml:"dbname"`
		Password string `yaml:"password"`
		Port     string `yaml:"port"`
	} `yaml:"pg"`
	Redis struct {
		Host     string `yaml:"host"`
		Password string `yaml:"password"`
		Port     string `yaml:"port"`
	} `yaml:"redis"`
	Smtp struct {
		Email    string `yaml:"email"`
		Password string `yaml:"password"`
	} `yaml:"smtp"`
	File struct {
		SavePath string `yaml:"savepath"`
	} `yaml:"file"`
	Grpc struct {
		Host string `yaml:"host"`
		Port string `yaml:"port"`
	}
}
