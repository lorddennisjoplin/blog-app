## Blog Application

## 1. Description

- **Blog Posts (CRUD)**
  - **Create:** Authenticated users can create new blog posts with a title, content, and an optional featured image.
  - **Read:** Authenticated users can view blog posts along with author information and associated comments.
  - **Update:** Authenticated users can edit their own posts. Featured images are validated for acceptable file types.
  - **Delete:** Authenticated users can delete their own posts, and admins can delete any post.

- **Comment System**
  - **Add Comments:** Authenticated users can comment on any blog post. Each comment stores a reference to the user who posted it. Comments are validated to prevent empty submissions.
  - **View Comments:** Users can retrieve all comments for a blog post.
  - **Delete Comments:** Only admins have the authority to delete any comment, ensuring content moderation and control.

- **Authorization & Security**
  - Users can register to create blog posts and leave comments. Username and email must be unique.
  - Users can perform update or delete operations only on their own posts.
  - Blog posts are only visible to authenticated users.
  - Admins can delete any blog post or comment.
  - Input validation ensures that data such as featured image and comment meet expected formats.
  - Error handling returns meaningful HTTP status codes for invalid operations or missing resources.

## 2. Login Credentials

- **Admin:**
  - U: admin@mail.com
  - P: admin123

- **User:**
  - U: lord@mail.com
  - P: lord1234
  - Or register a new one