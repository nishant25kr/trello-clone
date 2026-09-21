
export interface Section {
  id: string;
  title: string;
}

export interface Task {
  id: string;
  title: string;
  sectionId: string;
}

export interface Board {
  id: string;
  title: string;
}

export interface User {
  id: string,
  username: string
}

export interface Organization {
  id: string ,
  name: string, 
  description: string 
}