export function Footer() {
  return (
    <footer className="w-full border-t bg-background py-8">
      <div className="container px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {/* Sửa TagEdu AI thành TagEdu */}
          © {new Date().getFullYear()} TagEdu. Đã đăng ký bản quyền.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Điều khoản dịch vụ</a>
          <a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a>
        </div>
      </div>
    </footer>
  );
}