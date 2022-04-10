REPORT_BUILD_DIR=./build
PDFLATEX=pdflatex -interaction=nonstopmode -halt-on-error -file-line-error -output-directory=$(REPORT_BUILD_DIR) ./report.tex 
BIBTEX=bibtex $(REPORT_BUILD_DIR)/report

report: $(REPORT_BUILD_DIR)/report.pdf

$(REPORT_BUILD_DIR)/report.pdf: report.tex arxiv.sty references.bib
	mkdir -p $(REPORT_BUILD_DIR)
	latexmk -outdir=$(REPORT_BUILD_DIR) -pdf

.PHONY: clean
clean:
	rm $(REPORT_BUILD_DIR)/*
