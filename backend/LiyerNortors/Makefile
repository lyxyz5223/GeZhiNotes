PROJECT := LiyeNortors
GOPROXY := $(shell go env GOPROXY)
GO111MODULE := $(shell go env GO111MODULE)

.PHONEY : clean tidy

.DEFAULT : $(PROJECT)

$(PROJECT) :  tidy
	go build -o $(PROJECT)

tidy :
ifneq (GO111MODULE, on)
	go env -w GO111MODULE="on"
endif
ifneq (GOPROXY, https://goproxy.cn, direct)
	go env -w GOPROXY="https://goproxy.cn, direct"
endif
	go mod tidy
clean :
	rm -rf $(PROJECT)