# Portrait Generator
- A fun and probably not accurate program that guesses and uses your MBTI to generate a line-art portrait
- Give it a try: https://jielyugt.github.io/self_portrait/

## Algorithm
- The user's approximate MBTI is collected from a small Q&A and stored as `mbti_vector`
- We calculate `feature_scores = mbti_vector x weight_map`, which decided which face JSON file should be used for each feature e.g. eye, mouth, etc
- As the `mbti_vector` gets updated through Q & A or sliders, the feattures morphs from one to another in realtime

## Development Tools
- Shape -> JSON sketch tool: https://jielyugt.github.io/self_portrait/shape_sketcher.html
- JSON -> Shape preview tool: https://jielyugt.github.io/self_portrait/preview_faces.html
