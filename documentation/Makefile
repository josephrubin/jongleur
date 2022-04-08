REPORT_BUILD_DIR=./build
PDFLATEX=pdflatex -interaction=nonstopmode -halt-on-error -file-line-error -output-directory=$(REPORT_BUILD_DIR) ./report.tex 
BIBTEX=bibtex $(REPORT_BUILD_DIR)/report

report: $(REPORT_BUILD_DIR)/report.pdf

$(REPORT_BUILD_DIR)/report.pdf: report.tex references.bib
	mkdir -p $(REPORT_BUILD_DIR)
	$(PDFLATEX)
	$(BIBTEX)
	$(PDFLATEX)
	$(PDFLATEX)

.PHONY: clean
clean:
	rm $(REPORT_BUILD_DIR)/*
