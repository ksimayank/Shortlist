.PHONY: test eval seed run lint clean

test:
	python3 -m unittest shortlist/tests/test_all.py

eval:
	python3 shortlist/scripts/evaluate.py

seed:
	python3 shortlist/scripts/seed_db.py

run:
	python3 shortlist/scripts/run_server.py

clean:
	rm -rf __pycache__ shortlist/app/**/__pycache__ shortlist/tests/__pycache__
