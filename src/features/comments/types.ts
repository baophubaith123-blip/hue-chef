export interface RecipeComment {
  id: string;
  recipeId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  rating: 1 | 2 | 3 | 4 | 5;
  likes: number;
  likedBy: string[];
  reportCount: number;
  reportedBy: string[];
  isReported?: boolean;
  createdAt: string;
  editedAt?: string;
}

export interface CommentReport {
  id: string;
  commentId: string;
  recipeId: string;
  reporterId: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
