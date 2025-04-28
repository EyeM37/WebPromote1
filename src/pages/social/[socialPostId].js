import { useRouter } from 'next/router';
import { use, useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Loading from '../../component/Loading';

export default function SocialShare() {
  const router = useRouter();
  const params = useParams();
  const socialPostId = params?.socialPostId;
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('social');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIdx, setModalImageIdx] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const videoRefs = useRef([]);
  console.log('SocialID:', socialPostId);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const navigateToSection = (section) => {
    localStorage.setItem('scrollToSection', section);
    router.push('/', undefined, { shallow: true })
      .then(() => {
        if (section) {
          const element = document.getElementById(section);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleReply = (commentId) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const toggleReplies = (commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  const openImageModal = (idx) => {
    setModalImageIdx(idx);
    setModalOpen(true);
  };

  const handleUnauthorizedAction = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  useEffect(() => {
    const handleCloseMenu = () => {
      setMenuOpen(false);
    };

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleCloseMenu);
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleCloseMenu);
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchShareData = async () => {
      if (!socialPostId) return;
      
      try {
        const response = await fetch(`https://mefarm-dev-api.canadev.net/api/social/post/share/${socialPostId}`);
        const data = await response.json();
        console.log('Fetched share data:', data);
        setShareData(data);
      } catch (error) {
        console.error('Error fetching share data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
  }, [socialPostId]);

  useEffect(() => {
    sessionStorage.setItem('fromSocial', 'true');
  }, []);

  useEffect(() => {
    if (!shareData?.model?.videoContents?.length) return;

    const observers = [];
    videoRefs.current = videoRefs.current.slice(0, shareData.model.videoContents.length);

    shareData.model.videoContents.forEach((_, idx) => {
      const video = videoRefs.current[idx];
      if (!video) return;
      const observer = new window.IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.5 }
      );
      observer.observe(video);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer, idx) => {
        const video = videoRefs.current[idx];
        if (video) observer.unobserve(video);
        observer.disconnect();
      });
    };
  }, [shareData]);

  useEffect(() => {
    if (socialPostId && socialPostId !== 'default') {
      // Store the social post ID in session storage
      sessionStorage.setItem('socialPostId', socialPostId);
    }
  }, [socialPostId]);

  const isLongText = shareData?.model?.messageContent && shareData.model.messageContent.length > 300;

  if (loading) return <Loading />;
  if (!shareData) return <div>Share not found</div>;

  return (
    <div className="container" style={{ fontFamily: 'FcMinimal, sans-serif', marginTop: '40px' }}>
    <nav className="navbar">
        <div className='navlogo'>
          <a className="name" style={{ display: 'flex', alignItems: 'center' }} href="/">
            <img src="/Photo/logo.jpg" alt="logo" className="logo" style={{ width: "50px", marginRight: "5px" }} />
            Mefarm
          </a>
        </div>

        <div className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={(e) => {
          e.stopPropagation();
          toggleMenu();
        }}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`navLinks ${menuOpen ? 'active' : ''}`}>
        <li className="active">
            <a href="" rel="noopener noreferrer" style={{ cursor: 'pointer' }}>SOCIAL SHARE</a>
          </li>
          <li>
            <a onClick={() => navigateToSection('home')} style={{ cursor: 'pointer' }}>HOME</a>
          </li>
          <li>
            <a onClick={() => navigateToSection('concept')} style={{ cursor: 'pointer' }}>CONCEPT</a>
          </li>
          <li>
            <a onClick={() => navigateToSection('contact')} style={{ cursor: 'pointer' }}>CONTACT</a>
          </li>
          <li>
            <a onClick={() => navigateToSection('policy')} style={{ cursor: 'pointer' }}>POLICY</a>
          </li>
        </ul>
      </nav>

      <div className="share-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Social Share</h1>
        {shareData?.model && (
          <div className="share-content">
            <div className="user-info" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <img 
                src={shareData.model.profileImageUrl || '/default-avatar.png'} 
                alt="Profile" 
                style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }}
              />
              <div>
                <h3 style={{ margin: 0 }}>{shareData.model.firstName}</h3>
                <small>{formatDate(shareData.model.updatedAt)}</small>
              </div>
            </div>

            <div
              className={`post-content${isLongText && !isExpanded ? ' collapsed' : ''}`}
              style={isLongText && !isExpanded ? { maxHeight: 120, overflow: 'hidden', position: 'relative' } : {}}
            >
              <p style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
                {shareData.model.messageContent}
              </p>
              {isLongText && !isExpanded && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '2.5em',
                    background: 'linear-gradient(transparent, white 80%)'
                  }}
                />
              )}
            </div>
            {isLongText && (
              <div
                className="read-more-button"
                style={{ color: '#65676b', fontWeight: 600, cursor: 'pointer', margin: '8px 0' }}
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                {isExpanded ? 'Show less' : 'See more'}
              </div>
            )}

            {shareData.model.imageContents?.length > 0 && (() => {
              const images = shareData.model.imageContents;
              const imgCount = images.length;

              // 5+ images: Facebook style grid
              if (imgCount >= 5) {
                return (
                  <div className="image-grid fb-five-plus">
                    {/* Large left image */}
                    <div className="fb-cell fb-large" onClick={() => openImageModal(0)} style={{ cursor: 'pointer' }}>
                      <img src={images[0].url} alt="Content 1" />
                    </div>
                    {/* Top right 2 images */}
                    <div className="fb-cell fb-top-right" onClick={() => openImageModal(1)} style={{ cursor: 'pointer' }}>
                      <img src={images[1].url} alt="Content 2" />
                    </div>
                    <div className="fb-cell fb-top-right" onClick={() => openImageModal(2)} style={{ cursor: 'pointer' }}>
                      <img src={images[2].url} alt="Content 3" />
                    </div>
                    {/* Bottom right 2 images */}
                    <div className="fb-cell fb-bottom-right" onClick={() => openImageModal(3)} style={{ cursor: 'pointer' }}>
                      <img src={images[3].url} alt="Content 4" />
                    </div>
                    <div className="fb-cell fb-bottom-right" onClick={() => openImageModal(4)} style={{ position: 'relative', cursor: 'pointer' }}>
                      <img src={images[4].url} alt="Content 5" style={imgCount > 5 ? { filter: 'brightness(0.7)' } : {}} />
                      {imgCount > 5 && (
                        <span className="fb-more-overlay">
                          +{imgCount - 5}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

           
              if (imgCount === 4) {
                return (
                  <div className="image-grid four-images">
                    {images.map((img, idx) => (
                      <div key={img.id} className="image-container" style={{ cursor: 'pointer' }} onClick={() => openImageModal(idx)}>
                        <img src={img.url} alt={`Content ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                );
              }

          
              if (imgCount === 3) {
                return (
                  <div className="image-grid three-images" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', height: 350 }}>
                    {/* Left large image */}
                    <div style={{ gridRow: '1 / span 2', gridColumn: '1', overflow: 'hidden', borderRadius: 8, cursor: 'pointer' }} onClick={() => openImageModal(0)}>
                      <img
                        src={images[0].url}
                        alt="Content 1"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                    {/* Top right image */}
                    <div style={{ gridRow: '1', gridColumn: '2', overflow: 'hidden', borderRadius: 8, cursor: 'pointer' }} onClick={() => openImageModal(1)}>
                      <img
                        src={images[1].url}
                        alt="Content 2"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                    {/* Bottom right image */}
                    <div style={{ gridRow: '2', gridColumn: '2', overflow: 'hidden', borderRadius: 8, cursor: 'pointer' }} onClick={() => openImageModal(2)}>
                      <img
                        src={images[2].url}
                        alt="Content 3"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </div>
                );
              }

           
              return (
                <div className={`image-grid ${imgCount === 1 ? 'single-image' : 'two-images'}`}>
                  {images.map((img, idx) => (
                    <div key={img.id} className="image-container" style={{ cursor: 'pointer' }} onClick={() => openImageModal(idx)}>
                      <img src={img.url} alt={`Content ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              );
            })()}

            {modalOpen && (
              <div
                className="image-modal-overlay"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: 'rgba(0,0,0,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2000
                }}
                onClick={() => setModalOpen(false)}
              >
                <div
                  className="image-modal-content"
                  style={{
                    position: 'relative',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <img
                    src={shareData.model.imageContents[modalImageIdx].url}
                    alt="Full"
                    style={{
                      maxWidth: '90vw',
                      maxHeight: '80vh',
                      borderRadius: '8px',
                      boxShadow: '0 2px 16px rgba(0,0,0,0.5)'
                    }}
                  />
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      fontSize: 24,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  {shareData.model.imageContents.length > 1 && (
                    <>
                      <button
                        onClick={() => setModalImageIdx((modalImageIdx - 1 + shareData.model.imageContents.length) % shareData.model.imageContents.length)}
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.4)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          fontSize: 24,
                          cursor: 'pointer'
                        }}
                        aria-label="Previous"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setModalImageIdx((modalImageIdx + 1) % shareData.model.imageContents.length)}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.4)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          fontSize: 24,
                          cursor: 'pointer'
                        }}
                        aria-label="Next"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {shareData.model.videoContents?.length > 0 && (
              <div className="video-container" style={{ marginBottom: '20px' , textAlign: 'center'}}>
                {shareData.model.videoContents.map((video, idx) => (
                  <video 
                    key={video.id}
                    ref={el => videoRefs.current[idx] = el}
                    controls
                    muted
                    playsInline
                    style={{ width: '50%', borderRadius: '8px' }}
                  >
                    <source src={video.url} type="video/mp4" />
                  </video>
                ))}
              </div>
            )}

            <div className="interaction-stats" style={{ display: 'flex', gap: '20px', padding: '10px 0', borderTop: '1px solid #eee' }}>
              <button 
                onClick={handleUnauthorizedAction}
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer',
                  color: shareData.model.isLike ? '#1877f2' : 'inherit'
                }}
              >
                ❤️ {shareData.model.numberOfLike} likes
              </button>
              <button
                onClick={handleUnauthorizedAction}
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer'
                }}
              >
                💬 {shareData.model.numberOfComment} comments
              </button>
              <button 
                onClick={handleShare}
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer',
                  color: shareData.model.isShare ? '#1877f2' : 'inherit'
                }}
              >
                🔄 {shareData.model.numberOfShare} shares
              </button>
            </div>

            {showShareDialog && (
              <div className="share-dialog-overlay" 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000
                }}
                onClick={() => setShowShareDialog(false)}
              >
                <div className="share-dialog" 
                  style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    minWidth: '300px',
                    maxWidth: '90%',
                    position: 'relative'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0 }}>Share this post</h3>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}>
                    <input 
                      type="text" 
                      value={typeof window !== 'undefined' ? window.location.href : ''} 
                      readOnly
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        marginRight: '10px'
                      }}
                    />
                    <button
                      onClick={handleCopyLink}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: copySuccess ? '#4CAF50' : '#1877f2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {copySuccess ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowShareDialog(false)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      border: 'none',
                      background: 'none',
                      fontSize: '20px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {shareData.model.comments?.length > 0 && (
              <div className="comments-section" style={{ marginTop: '20px' }}>
                <h4>Comments</h4>
                {shareData.model.comments.map(comment => (
                  <div key={comment.id} style={{ marginTop: '15px' }}>
                    <div className="comment" style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                        <img 
                          src={comment.profileImageUrl || '/default-avatar.png'} 
                          alt="Commenter" 
                          style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                        />
                        <div>
                          <span style={{ fontWeight: 'bold' }}>{comment.firstName}</span>
                          <small style={{ display: 'block', color: '#65676b'}}>
                            {formatDate(comment.updatedAt)}
                          </small>
                        </div>
                      </div>
                      <p style={{ marginLeft: '40px' }}>{comment.messageContent}</p>
                      
                      <div style={{ marginTop: '5px' , marginLeft: '25px'}}>
                     
                        {comment.replies?.length > 0 && (
                          <button 
                            onClick={() => toggleReplies(comment.id)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#65676b', marginLeft: '10px' }}
                          >
                            {showReplies[comment.id] ? 'Hide replies' : `Show ${comment.replies.length} replies`}
                          </button>
                        )}
                      </div>
                    </div>

                    {showReplies[comment.id] && comment.replies?.map(reply => (
                      <div key={reply.id} style={{ marginLeft: '40px', marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                          <img 
                            src={reply.profileImageUrl || '/default-avatar.png'} 
                            alt="Replier" 
                            style={{ width: '25px', height: '25px', borderRadius: '50%', marginRight: '10px' }}
                          />
                          <div>
                            <span style={{ fontWeight: 'bold' }}>{reply.firstName}</span>
                            <small style={{ display: 'block', color: '#65676b' }}>
                              {formatDate(reply.updatedAt)}
                            </small>
                          </div>
                        </div>
                        <p>{reply.messageContent}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="download-buttons" style={{
        animation: isShaking ? 'shake 0.5s ease-in-out' : 'none'
      }}>
        <a 
          href="https://play.google.com/store/" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <img 
            src="/Photo/playstore.jpg" 
            alt="Get it on Google Play" 
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        </a>
        <a 
          href="https://www.apple.com/app-store/" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <img 
            src="/Photo/appstore.jpg" 
            alt="Download on the App Store" 
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        </a>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(5px); }
          50% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}



