from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import ProjectRequest
from schemas import ProjectRequestCreate, ProjectRequestResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Commercial Website API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to Commercial Website API"}


@app.post("/api/project-requests", response_model=ProjectRequestResponse)
def create_project_request(request: ProjectRequestCreate, db: Session = Depends(get_db)):
    """Save a new project request from a visitor."""
    db_request = ProjectRequest(**request.model_dump())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request


@app.get("/api/project-requests", response_model=List[ProjectRequestResponse])
def get_all_requests(db: Session = Depends(get_db)):
    """Retrieve all project requests (for admin view)."""
    requests = db.query(ProjectRequest).order_by(ProjectRequest.submitted_at.desc()).all()
    return requests


@app.get("/api/project-requests/{request_id}", response_model=ProjectRequestResponse)
def get_request(request_id: int, db: Session = Depends(get_db)):
    """Get a specific project request by ID."""
    db_request = db.query(ProjectRequest).filter(ProjectRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Project request not found")
    return db_request


@app.delete("/api/project-requests/{request_id}")
def delete_request(request_id: int, db: Session = Depends(get_db)):
    """Delete a project request."""
    db_request = db.query(ProjectRequest).filter(ProjectRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Project request not found")
    db.delete(db_request)
    db.commit()
    return {"message": f"Project request {request_id} deleted successfully"}


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "API is running"}
