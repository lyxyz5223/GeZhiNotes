package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

var cfgPath = "config.local.yaml"

func SetUp() (*Setting, error) {
	config := new(Setting)
	data, err := os.ReadFile(cfgPath)
	if err != nil {
		return nil, err
	}
	if err := yaml.Unmarshal(data, config); err != nil {
		return nil, err
	}
	return config, nil
}
