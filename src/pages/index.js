import { useState, useRef, useEffect } from 'react';
import contactStyles from '../styles/Contact.module.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import Loading from '../component/Loading';

export default function Home() {
  const [activeMenu, setActiveMenu] = useState('home');
  const [activeSocial, setActiveSocial] = useState(false);
  const [socialPostId, setSocialPostId] = useState(null);
  const [data, setData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const homeRef = useRef(null);
  const conceptRef = useRef(null);
  const contactRef = useRef(null);
  const policyRef = useRef(null);
  const slideContainerRef = useRef(null);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleCloseMenu = () => {
      setMenuOpen(false);
    };

    window.addEventListener('scroll', handleCloseMenu);
    window.addEventListener('click', handleCloseMenu);

    return () => {
      window.removeEventListener('scroll', handleCloseMenu);
      window.removeEventListener('click', handleCloseMenu);
    };
  }, []);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    const touch = e.touches ? e.touches[0] : e;
    setStartX(touch.clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const diffX = touch.clientX - startX;

    if (diffX > 50) {
      prevSlide();
      setIsDragging(false);
    } else if (diffX < -50) {
      nextSlide();
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    telephoneNo: '',
    textMessage: ''
  });

  const [activePolicyTab, setActivePolicyTab] = useState(null);

  const togglePolicyTab = (tab) => {
    setActivePolicyTab(activePolicyTab === tab ? null : tab);
  };

  useEffect(() => {
    AOS.init({ duration: 1000, offset: 100 });
  }, []);

  const fetchData = async (locationName) => {
    try {
      const response = await fetch(`https://mefarm-dev-api.canadev.net/api/admin/homepage/content/list/${locationName}`);
      const result = await response.json();
      return result.model;
    } catch (error) {
      console.error(`Error fetching data for ${locationName}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const [homeData, conceptData, contactData, policyData] = await Promise.all([
        fetchData('home'),
        fetchData('concept'),
        fetchData('contact'),
        fetchData('policy')
      ]);

      if (homeData && conceptData && contactData && policyData) {
        const sortedHomeData = homeData.sort((a, b) => a.typeName.localeCompare(b.typeName));
        const sortedConceptData = conceptData.sort((a, b) => a.typeName.localeCompare(b.typeName));
        const sortedContactData = contactData.sort((a, b) => a.typeName.localeCompare(b.typeName));
        const sortedPolicyData = policyData.sort((a, b) => a.typeName.localeCompare(b.typeName));

        setData({
          home: [
            { image_url: sortedHomeData.find(item => item.typeName === 'cover')?.imageUri || '' },
            {
              phone: sortedHomeData.filter(item => item.typeName.startsWith('phone')).map(item => ({
                image_url: item.imageUri
              }))
            },
            {
              title: sortedHomeData.filter(item => item.typeName.startsWith('title')).map(item => ({
                description: item.description,
                image_url: item.imageUri
              }))
            },
            {
              slides: sortedHomeData.filter(item => item.typeName.startsWith('slide')).map(item => ({
                description: item.description,
                image_url: item.imageUri
              }))
            }
          ],
          concept: [
            {
              cover: sortedConceptData.filter(item => item.typeName.startsWith('cover')).map(item => ({
                description: item.description,
                image_url: item.imageUri
              }))
            },
            {
              phone: sortedConceptData.filter(item => item.typeName.startsWith('phone')).map(item => ({
                description: item.description,
                image_url: item.imageUri
              }))
            }
          ],
          contact: sortedContactData.map(item => ({
            description: item.description,
            image_url: item.imageUri,
            url: item.typeName
          })),
          policy: sortedPolicyData.map(item => ({
            typeName: item.typeName,
            description: item.description
          })),
        });
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (data) {
      const interval = setInterval(() => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % data.home[3].slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [data]);

  useEffect(() => {
    const handleScroll = () => {
      const homeTop = homeRef.current?.getBoundingClientRect()?.top ?? 0;
      const conceptTop = conceptRef.current?.getBoundingClientRect()?.top ?? 0;
      const contactTop = contactRef.current?.getBoundingClientRect()?.top ?? 0;
      const policyTop = policyRef.current?.getBoundingClientRect()?.top ?? 0;

      const viewportHeight = window.innerHeight / 3;

      if (homeTop >= 0 && homeTop < viewportHeight) {
        setActiveMenu('home');
      } else if (conceptTop >= 0 && conceptTop < viewportHeight) {
        setActiveMenu('concept');
      } else if (contactTop >= 0 && contactTop < viewportHeight) {
        setActiveMenu('contact');
      } else if (policyTop >= 0 && policyTop < viewportHeight) {
        setActiveMenu('policy');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const section = localStorage.getItem('scrollToSection');
    const policyAction = localStorage.getItem('policyAction');
    
    if (section && data) {
      localStorage.removeItem('scrollToSection');
      localStorage.removeItem('policyAction');
      
      if (section === 'policy') {
        setActivePolicyTab('privacy');
        setTimeout(() => {
          policyRef.current?.scrollIntoView({ behavior: 'smooth' });
          setActiveMenu('policy');
        }, 500);
      } else {
        setTimeout(() => {
          switch (section) {
            case 'home':
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setActiveMenu('home');
              break;
            case 'concept':
              conceptRef.current?.scrollIntoView({ behavior: 'smooth' });
              setActiveMenu('concept');
              break;
            case 'contact':
              contactRef.current?.scrollIntoView({ behavior: 'smooth' });
              setActiveMenu('contact');
              break;
          }
        }, 100);
      }
    }
  }, [data]);

  useEffect(() => {
    // Check for social post ID in session storage
    const storedSocialId = sessionStorage.getItem('socialPostId');
    if (storedSocialId) {
      setActiveSocial(true);
      setSocialPostId(storedSocialId);
    }
  }, []);

  const scrollToConcept = () => {
    setActiveMenu('concept');
    conceptRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    setActiveMenu('contact');
    contactRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPolicy = () => {
    setActiveMenu('policy');
    setActivePolicyTab('privacy');
    setTimeout(() => {
      policyRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % data.home[3].slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + data.home[3].slides.length) % data.home[3].slides.length);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstname || !formData.lastname || !formData.email || !formData.telephoneNo || !formData.textMessage) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields before submitting.',
      });
      return;
    }

    const contactData = {
      id: uuidv4(),
      contactDate: new Date().toISOString(),
      ...formData
    };

    try {
      const response = await fetch('https://mefarm-dev-api.canadev.net/api/admin/homepage/contact-us/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Contact information submitted successfully!',
        });
        setFormData({
          firstname: '',
          lastname: '',
          email: '',
          telephoneNo: '',
          textMessage: ''
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to submit contact information.',
        });
      }
    } catch (error) {
      console.error('Error submitting contact information:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while submitting contact information.',
      });
    }
  };

  if (!data) {
    return <Loading />;
  }

  return (
    <div className="container" style={{ fontFamily: 'FcMinimal, sans-serif' }}>
     <nav className="navbar">
        <div style={{ display: 'flex',alignItems: 'center' }}>
        <a className="name" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}  onClick={() => { setActiveMenu('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
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
        {activeSocial && (
            <li style={{ cursor: 'pointer' }}>
              <a 
                href={`/social/${socialPostId || 'default'}`}
                rel="noopener noreferrer"
              >
                SOCIAL SHARE
              </a>
            </li>
          )}
          <li className={activeMenu === 'home' ? 'active' : ''} style={{ cursor: 'pointer' }}>
            <a onClick={() => { setActiveMenu('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>HOME</a>
          </li>
          <li className={activeMenu === 'concept' ? 'active' : ''} style={{ cursor: 'pointer' }}>
            <a onClick={scrollToConcept}>CONCEPT</a>
          </li>
          <li className={activeMenu === 'contact' ? 'active' : ''} style={{ cursor: 'pointer' }}>
            <a onClick={scrollToContact}>CONTACT</a>
          </li>
          <li className={activeMenu === 'policy' ? 'active' : ''} style={{ cursor: 'pointer' }}>
            <a onClick={scrollToPolicy}>POLICY</a>
          </li>
        </ul>
      </nav>

      <div className='Home' ref={homeRef}>
        <img src={data.home[0].image_url} alt="cover1" className="coverImage" />
        <div className="store">
          <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer">
            <img 
              src="/Photo/appstore.jpg" 
              alt="appstore" 
              className="storeImage" 
              style={{ transition: 'transform 0.3s', cursor: 'pointer' }} 
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} 
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'} 
            />
          </a>
          <div className="phones-container">
            <div className="phone-frame1">
              <img src="/Photo/mockphone1.png" alt="phone1" className="phone1" />
              <img src={data.home[1].phone[0].image_url} alt="phone1-content" className="phone-content1" />
            </div>
            <div className="phone-frame2">
              <img src="/Photo/mockphone2.png" alt="phone2" className="phone2" />
              <img src={data.home[1].phone[1].image_url} alt="phone2-content" className="phone-content2" />
            </div>
          </div>
          <a href="https://play.google.com/store/" target="_blank" rel="noopener noreferrer">
            <img 
              src="/Photo/playstore.jpg" 
              alt="playstore" 
              className="storeImage" 
              style={{ marginLeft: '6%', transition: 'transform 0.3s', cursor: 'pointer' }} 
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} 
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'} 
            />
          </a>
        </div>

        <div className="title1">
          <div>
            <div style={{ paddingLeft: '2%', paddingRight: '2%' }} dangerouslySetInnerHTML={{ __html: data.home[2].title[0].description || "" }} />
            <img className='logo' src={data.home[2].title[0].image_url} alt={data.home[2].title[0].description} />
          </div>
        </div>

        <div className="diagonal-background">
          <div className="content-container"  >
            <div
              className="slide-container"
              ref={slideContainerRef}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onSelect={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              {data.home[3].slides.map((item, index) => (
                <div key={index} className={`slide ${index === currentSlide ? 'active' : ''}`}>
                  <img src={item.image_url} alt={item.image_url} />
                  <div>
                  <div className="slide-content" dangerouslySetInnerHTML={{ __html: item.description }} />
                  
                  </div>
                </div>
              ))}
            </div>

            <div className="dots-container">
              {data.home[3].slides.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => handleDotClick(index)}
                ></span>
              ))}
            </div>
          </div>
        </div>

        <div className="title2">
          <img src={data.home[2].title[1].image_url}/>
          <div dangerouslySetInnerHTML={{ __html: data.home[2].title[1].description || "" }} style={{ textAlign: "center" }} />
        </div>

        <div className="title3">
          {data.home[2].title.slice(2).map((item, index) => (
            <div style={{ width: '70%' }} key={index}>
              <div dangerouslySetInnerHTML={{ __html: item.description }} style={{ textAlign: "center" }} />
            </div>
          ))}
          <button className='btcontact' onClick={scrollToContact}>Contact Us →</button>
        </div>
      </div>

      <div className="concept" ref={conceptRef}>
        <div className="section" style={{ paddingTop: '6%', paddingBottom: '10%' }}>
          <div className="diagonal-background2" />
          <div className="cover1">
            <div alt="concept cover" className='conceptcover1' dangerouslySetInnerHTML={{ __html: data.concept[0].cover[0].description || "" }} />
            <img src={data.concept[0].cover[0].image_url} alt="concept cover" className='conceptcover1' />
          </div>

          <div className="concept-grid">
            {data.concept[1].phone.slice(0, 2).map((item, index) => (
              <div key={index} className="concept-grid-item" data-aos="fade-up">
                <div className="conceptphone" dangerouslySetInnerHTML={{ __html: item.description }} />
                <div className="phone-frame" style={{ position: 'relative', width: '270px', height: '550px' ,right: '-15px'}}>
                  <img
                    src={item.image_url}
                    alt={`phone${index}`}
                    style={{
                      position: 'absolute',
                      top: '11px',
                      left: '8px',
                      width: '225px',
                      height: '483px',
                      borderRadius: '2em',
                      objectFit: 'cover',
                      filter: 'drop-shadow(0.5em 0.5em 1em rgba(46, 46, 46, 1))'

                    }}
                  />
                  <img
                    src="/Photo/mockphone1.png"
                    alt="phone-frame"
                    style={{
                      position: 'relative',
                      width: '90%',
                      height: '90%',
                      pointerEvents: 'none',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="alternating-grid">
            {data.concept[1].phone.slice(2).map((item, index) => (
              <div key={index} className="alternating-grid-item">
                <div className="conceptphone" dangerouslySetInnerHTML={{ __html: item.description }} data-aos="fade-up" />
                <div className="phone-frame" data-aos="fade-up" style={{ position: 'relative', width: '270px', height: '550px' ,right: '-15px'}}>
                  <img
                    src={item.image_url}
                    alt={`phone${index}`}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '11px',
                      width: '220px',
                      height: '480px',
                      borderRadius: '25px',
                      objectFit: 'cover',
                      filter: 'drop-shadow(0.5em 0.5em 1em rgba(46, 46, 46, 1))'
                    }}
                  />
                  <img
                    src="/Photo/mockphone1.png"
                    alt="phone-frame"
                    style={{
                      position: 'absolute',
                      width: '90%',
                      height: '90%',
                      pointerEvents: 'none',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </div>
            ))}
            {data.concept[0].cover.slice(1).map((item, index) => (
              <div key={index} className="alternating-grid-item" data-aos="fade-up" data-aos-delay={`${(index) * 100}`}>
                <div className="conceptphone" dangerouslySetInnerHTML={{ __html: item.description }} />
                <img className="conceptcover2" src={item.image_url} alt={`cover2-${index}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr />

      <div ref={contactRef} className={contactStyles.container}>
        <div className={contactStyles.contactSection}>
          <div className={contactStyles.contactInfo}>
            {data.contact.map((item, index) => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <a key={index} href={item.url ? item.url : "#"} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <img src={item.image_url} alt={item.description} style={{ marginRight: '8px' }} />
                  <div dangerouslySetInnerHTML={{ __html: item.description }} style={{ color: 'black', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }} />
                </a>
              </div>
            ))}
          </div>
          <div className={contactStyles.contactForm}>
            <h1>Contact Us</h1>
            <form onSubmit={handleSubmit}>
              <div>
                <input type="text" placeholder="First Name" id="firstname" className={contactStyles.input} style={{ marginRight: '20px' }} value={formData.firstname} onChange={handleChange} />
                <input type="text" placeholder="Last Name" id="lastname" className={contactStyles.input} value={formData.lastname} onChange={handleChange} />
              </div>
              <input type="email" placeholder="Email" id="email" className={contactStyles.input} value={formData.email} onChange={handleChange} />
              <input type="number" placeholder="Phone Number" id="telephoneNo" className={contactStyles.input} value={formData.telephoneNo} onChange={handleChange} />
              <textarea placeholder="Message" id="textMessage" className={contactStyles.textarea} value={formData.textMessage} onChange={handleChange}></textarea>
              <button type="submit" className={contactStyles.button}>Send</button>
            </form>
          </div>
        </div>
      </div>

      <div ref={policyRef} className="policy-section">
        <div className="policy-container">
          <div className="policy-tabs">
            <button
              className={`policy-tab ${activePolicyTab === 'privacy' ? 'active' : ''}`}
              onClick={() => togglePolicyTab('privacy')}
            >
              Policy <span className="arrow">▼</span>
            </button>
          </div>

          <div className={`policy-content ${activePolicyTab === 'privacy' ? 'active' : ''}`}>
            {activePolicyTab === 'privacy' && (
              <div className="policy-detail">
                <div>
                  {data.policy.map((item) => (
                    <div key={item.id}>
                      <h2>{item.typeName}</h2>
                      <div dangerouslySetInnerHTML={{ __html: item.description }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div style={{ height: '60%', display: 'flex', justifyContent: 'center' }}>
          <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">
            <img src="./Photo/fbfooter.png" alt="Facebook" style={{ width: '30px', margin: '0 5px' }} />
          </a>
          <a href="https://www.line.me/" target="_blank" rel="noopener noreferrer">
            <img src="./Photo/linefooter.png" alt="Line" style={{ width: '30px', margin: '0 5px' }} />
          </a>
        </div>
        <p style={{ color: 'black' }}>© All Rights Reserved by Mefarm</p>
      </footer>
    </div>
  );
}