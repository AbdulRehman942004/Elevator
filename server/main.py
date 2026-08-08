"""Server entrypoint.

    uvicorn main:app --reload

The application itself lives in `api/app.py`; this module only exposes it under
the name uvicorn looks for by default. The scenario walk-through that used to
live here is now `demo.py`, and still runs with `python demo.py`.
"""

from api.app import app

__all__ = ["app"]
