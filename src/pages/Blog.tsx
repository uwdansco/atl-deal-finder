import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/data/blogPosts";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Footer from "@/components/Footer";

export default function Blog() {
  const categories = Array.from(new Set(blogPosts.map(post => post.category)));

  return (
    <>
      <SEO
        title="Flight Deals Blog - Tips & Guides"
        description="Expert tips on finding cheap flights from Singapore, travel guides, destination insights, and money-saving strategies for budget travelers."
        keywords="flight deals blog, cheap flights tips, travel guides, Singapore travel, budget travel"
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Travel Tips & Flight Deals Blog
              </h1>
              <p className="text-xl text-muted-foreground">
                Expert guides, destination insights, and money-saving strategies for savvy travelers
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                All Posts
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} state={{ post }}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <div
                      className="h-48 bg-cover bg-center rounded-t-lg"
                      style={{ backgroundImage: `url(${post.imageUrl})` }}
                    />
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{post.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime} min read
                        </span>
                      </div>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(post.publishedDate), "MMM dd, yyyy")}
                        </div>
                        <Button variant="ghost" size="sm" className="group">
                          Read More
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
