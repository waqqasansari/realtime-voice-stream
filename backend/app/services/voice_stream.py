import random


def generate_dummy_caption(chunk_index: int) -> str:
    starters = [
        "Hearing",
        "Detecting",
        "Catching",
        "Noting",
        "Parsing",
        "Capturing",
    ]
    subjects = [
        "a quick phrase",
        "background speech",
        "short response",
        "a brief thought",
        "a clear sentence",
        "steady narration",
    ]
    extras = [
        "coming through",
        "from the stream",
        "in real time",
        "with stable signal",
        "for this chunk",
        "just now",
    ]
    return (
        f"{random.choice(starters)} {random.choice(subjects)} "
        f"{random.choice(extras)} (chunk {chunk_index})."
    )
