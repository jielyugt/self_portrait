# Portrait Generator
This program collects your characteristics to generate a line-art portrait: https://jielyugt.github.io/self_portrait/

<img src="https://github.com/jielyugt/self_portrait/blob/main/demos/morph_loop.gif" width=50%>

## Algorithm
- The user's approximate MBTI is collected from a small Q&A and stored as `mbti_vector`
- We calculate `feature_scores = mbti_vector x weight_map`, which decided which face JSON file should be used for each feature e.g. eye, mouth, etc
- As the `mbti_vector` gets updated through Q & A or sliders, the feattures morphs from one to another in realtime

## Development Tools
Shape -> JSON sketch tool: https://jielyugt.github.io/self_portrait/shape_sketcher.html

<img src="https://github.com/jielyugt/self_portrait/blob/main/demos/sketcher_tool.png" width=50%>

JSON -> Shape preview tool: https://jielyugt.github.io/self_portrait/preview_faces.html

<img src="https://github.com/jielyugt/self_portrait/blob/main/demos/preview_tool.png" width=50%>
