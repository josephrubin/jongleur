BUILD_DIR=build

REPORT_DIR=thesis
REPORT_BUILD_DIR=$(REPORT_DIR)/$(BUILD_DIR)

TALK_DIR=presentation
TALK_BUILD_DIR=$(TALK_DIR)/$(BUILD_DIR)

.PHONY: all
all: report talk

report: $(REPORT_BUILD_DIR)/report.pdf

$(REPORT_BUILD_DIR)/report.pdf: $(REPORT_DIR)/report.tex $(REPORT_DIR)/arxiv.sty $(REPORT_DIR)/references.bib
	mkdir -p $(REPORT_BUILD_DIR)
	cd $(REPORT_DIR) && latexmk -outdir=$(BUILD_DIR) -pdf

talk: $(TALK_BUILD_DIR)/talk.pdf

$(TALK_BUILD_DIR)/talk.pdf: $(TALK_DIR)/talk.tex $(TALK_DIR)/references.bib
	mkdir -p $(TALK_BUILD_DIR)
	cd $(TALK_DIR) && latexmk -outdir=$(BUILD_DIR) -pdf

.PHONY: clean
clean:
	rm $(REPORT_BUILD_DIR)/*
