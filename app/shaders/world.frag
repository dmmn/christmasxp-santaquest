precision highp float;

#define PI 3.1415926535897932384626433832795

uniform vec2 uResolution;
uniform float uNear;
uniform float uFar;
uniform float uFov;
uniform float uTime;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform sampler2D uNoiseTexture;

varying vec2 vUv;


// STRUCTURES

struct voxel
{
  float dist;
  vec4 color;
};

// PRIMITIVES

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float udBox( vec3 p, vec3 b )
{
  return length(max(abs(p)-b,0.0));
}

// NOISES

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec2 random2f( vec2 seed )
{
  float rnd1 = mod(fract(sin(dot(seed, vec2(14.9898,78.233))) * 43758.5453), 1.0);
  float rnd2 = mod(fract(sin(dot(seed+vec2(rnd1), vec2(14.9898,78.233))) * 43758.5453), 1.0);
  return vec2(rnd1, rnd2);
}

float hash1( float n ) { return fract(43758.5453123*sin(n)); }
float hash1( vec2  n ) { return fract(43758.5453123*sin(dot(n,vec2(1.0,113.0)))); }
vec2  hash2( float n ) { return fract(43758.5453123*sin(vec2(n,n+1.0))); }
vec2  hash2( vec2  n ) { n = vec2( dot(n,vec2(127.1,311.7)), dot(n,vec2(269.5,183.3)) ); return fract(sin(n)*43758.5453); }
vec3  hash3( vec2  n ) { return fract(43758.5453123*sin(dot(n,vec2(1.0,113.0))+vec3(0.0,1.0,2.0))); }
vec4  hash4( vec2  n ) { return fract(43758.5453123*sin(dot(n,vec2(1.0,113.0))+vec4(0.0,1.0,2.0,3.0))); }

float noise( in float x )
{
    float p = floor(x);
    float f = fract(x);

    f = f*f*(3.0-2.0*f);

    return mix( hash1(p+0.0), hash1(p+1.0),f);
}

float noise( in vec2 x )
{
    vec2 p = floor(x);
    vec2 f = fract(x);

    f = f*f*(3.0-2.0*f);

    float n = p.x + p.y*157.0;

    return mix(mix( hash1(n+  0.0), hash1(n+  1.0),f.x),
               mix( hash1(n+157.0), hash1(n+158.0),f.x),f.y);
}

float cheapNoise( vec3 p) {
  return sin(p.x * 2.0)*sin(p.y * 2.0)*sin(p.z * 2.0);
}

const mat2 m2 = mat2( 0.80, -0.60, 0.60, 0.80 );

float fbm( vec2 p )
{
    float f = 0.0;

    f += 0.5000*noise( p ); p = m2*p*2.02;
    f += 0.2500*noise( p ); p = m2*p*2.03;
    f += 0.1250*noise( p ); p = m2*p*2.01;
    f += 0.0625*noise( p );

    return f/0.9375;
}

// UTILS

voxel smin( voxel voxel1, voxel voxel2 )
{
  float blendRatio = 1.;
  float ratio = clamp(.5 + .5 * (voxel2.dist - voxel1.dist) / blendRatio, 0., 1.);
  
  float dist = mix(voxel2.dist, voxel1.dist, ratio) - blendRatio * ratio * (1. - ratio);
  vec4 color = mix(voxel2.color, voxel1.color, ratio) - blendRatio * ratio * (1. - ratio);

  return voxel(dist, color);
}

voxel min( voxel voxel1, voxel voxel2 )
{
  if(voxel1.dist - voxel2.dist < 0.) {
    return voxel1;
  }
  else {
    return voxel2;
  }
}

vec4 getTexture(sampler2D texture, vec2 position, float scale) {
  return texture2D(uNoiseTexture, mod(position / scale, 1.));
}

// MAIN

voxel spheres( vec3 p, float modulo, float radius, vec2 offset, float duration ) {

  vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

  p.xz += offset;

  vec2 pos = floor(p.xz / modulo);

  vec2 noiseRatio = hash2(pos);
  // vec4 texel = getTexture(uNoiseTexture, pos, 512.);
  // float noiseRatio = texel.r;

  vec3 q = p;

  float elevationRatio = mod(uTime, duration) / duration;

  duration = noiseRatio.x + noiseRatio.y;

  q.xz = mod(q.xz, modulo) - modulo * .5;
  q.xz += (noiseRatio * .5 - .25) * modulo;
  q.y += radius * 2. - 200. * elevationRatio;

  radius *= (1. - elevationRatio) * noiseRatio.x;

  float dist = length(q) - radius;
  // float dist = length(q) - 5.;

  // float displacement = getTexture(uNoiseTexture, q.xz, 1000.).g;
  // dist += displacement * 5.;

  return voxel( dist, color );
}

voxel ground( vec3 p, vec4 tex ) {

  vec4 color = vec4(1.0, 1.0, 1.0, 1.0);

  // color = tex;
  // color *= color;
  
  float displacement = (tex.r + tex.g + tex.b) / 3.;
  float dist = p.y  + 5. - displacement * 10.;

  return voxel(dist, color);
}

voxel map( vec3 p) {

  vec4 noiseTex = getTexture(uNoiseTexture, p.xz, 100.);

  voxel voxel = ground(p, noiseTex);

  for(float i = 0.; i < 2.; i++) {
    float seed = i + 1.;
    voxel = smin(spheres(p, seed * 100., seed * 20., vec2(5. + seed * 160.0), seed * 1.), voxel);
  }

  // voxel = min(groundMap(p), voxel);

  return voxel;
}

vec3 calcNormal ( vec3 p ) {
  vec2 e = vec2(1., 0.0);
  return normalize(vec3(
    map(p + e.xyy).dist - map(p - e.xyy).dist,
    map(p + e.yxy).dist - map(p - e.yxy).dist,
    map(p + e.yyx).dist - map(p - e.yyx).dist
  ));
}

void main()
{
  float fovScaleY = tan((uFov / 180.0) * PI * .5);
  float aspect = uResolution.x / uResolution.y;

  vec2 position = ( gl_FragCoord.xy / uResolution.xy );
  position = position * 2. - 1.;

  vec3 vEye = -( uModelViewMatrix[3].xyz ) * mat3( uModelViewMatrix );
  vec3 vDir = vec3(position.x * fovScaleY * aspect, position.y * fovScaleY,-1.0) * mat3( uModelViewMatrix );
  vec3 vCameraForward = vec3( 0.0, 0.0, -1.0) * mat3( uModelViewMatrix );

  vec3 rayOrigin = vEye;
  vec3 rayDirection = normalize(vDir);

  vec4 col = vec4(0.0);
  
  float rayMarchingStep = 0.00001;
  float dist = uNear;
  voxel voxel;
  
  for(int i = 0; i < 64; i++) {
      if (rayMarchingStep < 0.00001 || rayMarchingStep > uFar) break;
      voxel = map( rayOrigin + rayDirection * dist);
      rayMarchingStep = voxel.dist;
      dist += rayMarchingStep;
  }
  
  if (dist < uFar) {
      col = voxel.color;
      col *= .75 + dot(calcNormal(rayOrigin + rayDirection * dist), vec3(0.0, 1.0, 0.0)) * .25;
  }

  vec3 intersectionPoint = -dist * rayDirection;
  float eyeHitZ = dist * dot(vCameraForward, rayDirection);

  float depth = eyeHitZ;

  depth = smoothstep( uNear, uFar, depth );

  gl_FragColor = vec4(col.rgb, 1.0 - depth);

}