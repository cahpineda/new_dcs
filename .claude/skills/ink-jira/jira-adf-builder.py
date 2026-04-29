#!/usr/bin/env python3
"""
jira-adf-builder.py — Convert simplified JSON structure to Atlassian Document Format (ADF).

Usage: python3 jira-adf-builder.py <input.json> <output.json>

Input format: JSON with a "sections" array of typed elements.
Output: ADF document ready for Jira API description field.

Supported section types:
  - heading: {"type": "heading", "level": 2, "text": "..."}
  - paragraph: {"type": "paragraph", "text": "..."}
  - bullet_list: {"type": "bullet_list", "items": ["...", "..."]}
  - ordered_list: {"type": "ordered_list", "items": ["...", "..."]}
"""

import json
import sys


def adf_text(text):
    return {"type": "text", "text": str(text)}


def adf_para(text):
    return {"type": "paragraph", "content": [adf_text(text)]}


def adf_heading(level, text):
    return {
        "type": "heading",
        "attrs": {"level": level},
        "content": [adf_text(text)],
    }


def adf_li(text):
    return {
        "type": "listItem",
        "content": [
            {"type": "paragraph", "content": [adf_text(text)]}
        ],
    }


def adf_bullet(items):
    return {
        "type": "bulletList",
        "content": [adf_li(i) for i in items if str(i).strip()],
    }


def adf_ordered(items):
    return {
        "type": "orderedList",
        "content": [adf_li(i) for i in items if str(i).strip()],
    }


def adf_doc(nodes):
    return {"version": 1, "type": "doc", "content": nodes}


def convert(sections):
    nodes = []
    for s in sections:
        t = s.get("type", "")
        if t == "heading":
            nodes.append(adf_heading(s.get("level", 2), s.get("text", "")))
        elif t == "paragraph":
            text = s.get("text", "")
            if text.strip():
                nodes.append(adf_para(text))
        elif t == "bullet_list":
            items = s.get("items", [])
            if items:
                nodes.append(adf_bullet(items))
        elif t == "ordered_list":
            items = s.get("items", [])
            if items:
                nodes.append(adf_ordered(items))
    return adf_doc(nodes)


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 jira-adf-builder.py <input.json> <output.json>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    with open(input_path) as f:
        data = json.load(f)

    sections = data.get("sections", [])
    doc = convert(sections)

    with open(output_path, "w") as f:
        json.dump(doc, f)

    print(f"ADF built: {len(sections)} sections -> {output_path}")


if __name__ == "__main__":
    main()
