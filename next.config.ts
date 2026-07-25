import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 디렉터리(/Users/mariakim)에 package-lock.json 이 있어 Next 가 workspace root 를
  // 잘못 추론하는 것을 막는다. 이 프로젝트가 루트다.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
