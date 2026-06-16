from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base


class ProjectRequest(Base):
    __tablename__ = "project_requests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    project_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timeline = Column(String, nullable=True)
    budget = Column(String, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ProjectRequest(id={self.id}, name={self.name}, email={self.email})>"
